#!/bin/bash
find ~/.nuget/packages -type f -name "*.dll" | while read -r dll; do
  cp -n "$dll" backend/GarageRadiatorERP.Tests/bin/Debug/net9.0/ 2>/dev/null || true
done
