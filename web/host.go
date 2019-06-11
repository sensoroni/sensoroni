// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

package web

import (
	"context"
	"net/http"
	"github.com/apex/log"
)

type HostHandler interface {
	Handle(responseWriter http.ResponseWriter, request *http.Request)
}

type HostHandlerImpl struct {
}

type HostAuth interface {
	IsAuthorized(request *http.Request) bool
}

type Host struct {
	Auth				HostAuth
	bindAddress	string
	htmlDir			string
	server    	*http.Server
	running			bool
	Version			string
}

func NewHost(address string, htmlDir string, version string) *Host {
	return &Host {
		running: false,
		bindAddress: address,
		htmlDir: htmlDir,
		Version: version,
	}
}

func (host *Host) Register(route string, handler HostHandler) {
	http.HandleFunc(route, handler.Handle)
}

func (host *Host) Stop() {
	if host.running {
		if err := host.server.Shutdown(context.Background()); err != nil {
			log.WithError(err).Error("Error while shutting down server")
		}
	}
}

func (host *Host) Start() {
	log.Info("Host starting")
	host.running = true
	http.Handle("/", http.FileServer(http.Dir(host.htmlDir)))
	host.server = &http.Server{Addr: host.bindAddress}
	err := host.server.ListenAndServe()
	if err != http.ErrServerClosed {
		log.WithError(err).Error("Unexpected fatal error in host")
	}
	host.running = false
	log.Info("Host exiting")
}

func (host *Host) IsRunning() bool {
	return host.running
}