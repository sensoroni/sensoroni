# Copyright 2019 Jason Ertel (jertel). All rights reserved.
#
# This program is distributed under the terms of version 2 of the
# GNU General Public License.  See LICENSE for further details.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

FROM golang:latest
ARG SENSORONI_VERSION
RUN mkdir -p golang ins/go/src/github.com/sensoroni/sensoroni
RUN apt -y update && apt -y install libpcap-dev
COPY . /go/src/github.com/sensoroni/sensoroni
WORKDIR /go/src/github.com/sensoroni/sensoroni
RUN ./build.sh "$SENSORONI_VERSION"

FROM alpine:latest
RUN mkdir -p /opt/sensoroni/jobs
WORKDIR /opt/sensoroni
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/sensoroni .
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/html ./html
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/COPYING .
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/LICENSE .
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/README.md .
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/sensoroni.json .
COPY --from=0 /go/src/github.com/sensoroni/sensoroni/version.json .
EXPOSE 9822/tcp
ENTRYPOINT ["/opt/sensoroni/sensoroni"]