#!/bin/bash

# Copyright 2019 Jason Ertel (jertel). All rights reserved.
#
# This program is distributed under the terms of version 2 of the
# GNU General Public License.  See LICENSE for further details.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

version=${1:-dev}

go get ./...
go build -a -ldflags '-extldflags "-static"' -tags netgo -installsuffix netgo cmd/sensoroni.go

echo "{\"label\":\"$version\",\"buildTime\":\"`date -u +%Y-%m-%dT%H:%M:%S`Z\"}" > version.json
