# Copyright 2019 Jason Ertel (jertel). All rights reserved.
#
# This program is distributed under the terms of version 2 of the
# GNU General Public License.  See LICENSE for further details.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

FROM golang:alpine as builder
ARG SENSORONI_VERSION
RUN apk update && apk add libpcap-dev bash git musl-dev gcc
COPY . /go/src/github.com/sensoroni/sensoroni
WORKDIR /go/src/github.com/sensoroni/sensoroni
RUN ./build.sh "$SENSORONI_VERSION"

FROM alpine:latest
ARG UID
ARG GID
RUN apk update && apk add tzdata ca-certificates && update-ca-certificates
RUN addgroup --gid "$GID" sensoroni
RUN adduser -D -u "$UID" -G sensoroni -g '' sensoroni
RUN mkdir -p /opt/sensoroni/jobs && chown sensoroni /opt/sensoroni/jobs
RUN mkdir -p /opt/sensoroni/logs && chown sensoroni /opt/sensoroni/logs
WORKDIR /opt/sensoroni
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/sensoroni .
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/html ./html
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/COPYING .
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/LICENSE .
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/README.md .
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/sensoroni.json .
COPY --from=builder /go/src/github.com/sensoroni/sensoroni/version.json .
USER sensoroni
EXPOSE 9822/tcp
VOLUME /opt/sensoroni/jobs
VOLUME /opt/sensoroni/logs
ENTRYPOINT ["/opt/sensoroni/sensoroni"]
