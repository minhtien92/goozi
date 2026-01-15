#!/usr/bin/env bash
set -euo pipefail

# Interactive rebuild script for Production environment
# Allows selecting multiple services to rebuild

echo "🏭 Goozi Production Rebuild"
echo "==========================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

COMPOSE_FILE="docker-compose.yml"

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ $COMPOSE_FILE not found!"
    exit 1
fi

# Get script directory for internal scripts
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REBUILD_SCRIPT="$SCRIPT_DIR/scripts/rebuild/rebuild-service.sh"

# Available services
SERVICES=("backend" "web" "cms" "postgres")
SERVICE_NAMES=("Backend API" "Frontend Web" "CMS Admin" "PostgreSQL Database")

echo "Available services to rebuild:"
echo ""
for i in "${!SERVICES[@]}"; do
    echo "  $((i+1))) ${SERVICE_NAMES[$i]} (${SERVICES[$i]})"
done
echo "  a) All services"
echo "  q) Quit"
echo ""

# Function to rebuild a service
rebuild_service() {
    local service=$1
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    if bash "$REBUILD_SCRIPT" "$service" "prod" "$COMPOSE_FILE"; then
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 0
    else
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        return 1
    fi
}

# Interactive selection
SELECTED_SERVICES=()

while true; do
    read -p "Select service(s) to rebuild (number, comma-separated, 'a' for all, 'd' when done): " selection
    
    if [ -z "$selection" ]; then
        continue
    fi
    
    # Convert to lowercase
    selection=$(echo "$selection" | tr '[:upper:]' '[:lower:]')
    
    # Handle quit
    if [ "$selection" = "q" ]; then
        echo "❌ Cancelled"
        exit 0
    fi
    
    # Handle "all"
    if [ "$selection" = "a" ]; then
        SELECTED_SERVICES=("${SERVICES[@]}")
        break
    fi
    
    # Handle "done"
    if [ "$selection" = "d" ]; then
        if [ ${#SELECTED_SERVICES[@]} -eq 0 ]; then
            echo "⚠️  No services selected. Please select at least one service."
            continue
        fi
        break
    fi
    
    # Handle comma-separated numbers
    IFS=',' read -ra SELECTIONS <<< "$selection"
    for sel in "${SELECTIONS[@]}"; do
        # Trim whitespace
        sel=$(echo "$sel" | xargs)
        
        # Check if it's a number
        if [[ "$sel" =~ ^[0-9]+$ ]]; then
            idx=$((sel - 1))
            if [ $idx -ge 0 ] && [ $idx -lt ${#SERVICES[@]} ]; then
                service="${SERVICES[$idx]}"
                # Check if already selected
                if [[ ! " ${SELECTED_SERVICES[@]} " =~ " ${service} " ]]; then
                    SELECTED_SERVICES+=("$service")
                    echo "  ✓ Added: ${SERVICE_NAMES[$idx]}"
                else
                    echo "  ⚠️  ${SERVICE_NAMES[$idx]} already selected"
                fi
            else
                echo "  ❌ Invalid number: $sel"
            fi
        else
            echo "  ❌ Invalid input: $sel"
        fi
    done
    
    # Show current selection
    if [ ${#SELECTED_SERVICES[@]} -gt 0 ]; then
        echo ""
        echo "Current selection:"
        for service in "${SELECTED_SERVICES[@]}"; do
            for i in "${!SERVICES[@]}"; do
                if [ "${SERVICES[$i]}" = "$service" ]; then
                    echo "  - ${SERVICE_NAMES[$i]}"
                    break
                fi
            done
        done
        echo ""
    fi
done

# Confirm before rebuilding
echo ""
echo "📋 Services to rebuild:"
for service in "${SELECTED_SERVICES[@]}"; do
    for i in "${!SERVICES[@]}"; do
        if [ "${SERVICES[$i]}" = "$service" ]; then
            echo "  - ${SERVICE_NAMES[$i]} (${service})"
            break
        fi
    done
done
echo ""

read -p "Continue with rebuild? [y/N]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Rebuild cancelled"
    exit 0
fi

# Rebuild selected services
echo ""
echo "🚀 Starting rebuild process..."
echo ""

FAILED_SERVICES=()
SUCCESS_SERVICES=()

for service in "${SELECTED_SERVICES[@]}"; do
    if rebuild_service "$service"; then
        SUCCESS_SERVICES+=("$service")
    else
        FAILED_SERVICES+=("$service")
    fi
done

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Rebuild Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ${#SUCCESS_SERVICES[@]} -gt 0 ]; then
    echo ""
    echo "✅ Successfully rebuilt:"
    for service in "${SUCCESS_SERVICES[@]}"; do
        for i in "${!SERVICES[@]}"; do
            if [ "${SERVICES[$i]}" = "$service" ]; then
                echo "   - ${SERVICE_NAMES[$i]}"
                break
            fi
        done
    done
fi

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Failed to rebuild:"
    for service in "${FAILED_SERVICES[@]}"; do
        for i in "${!SERVICES[@]}"; do
            if [ "${SERVICES[$i]}" = "$service" ]; then
                echo "   - ${SERVICE_NAMES[$i]}"
                break
            fi
        done
    done
    exit 1
fi

echo ""
echo "🎉 All selected services rebuilt successfully!"
echo ""
echo "📝 Useful commands:"
echo "   View logs:      docker-compose -f $COMPOSE_FILE logs -f [service]"
echo "   Check status:   docker-compose -f $COMPOSE_FILE ps"
echo ""
