// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU General Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
const routes = [];

$(document).ready(function() {
  const vmHead = new Vue({
    el: 'head',
    data: {
      i18n: i18n.getLocalizedTranslations(navigator.language),
    },
  });
  const vmMain = new Vue({
    el: '#app',
    vuetify: new Vuetify({
      theme: {
        dark: true,
        options: {
          customProperties: true,
        },
      },
    }),
    router: new VueRouter({ routes }),
    data: {
      i18n: i18n.getLocalizedTranslations(navigator.language),
      loading: false,
      error: false,
      message: "",
      toolbar: null,
      wsUrl: (location.protocol == 'https:' ?  'wss://' : 'ws://') + location.host + location.pathname + 'ws',
      apiUrl: location.origin + location.pathname + 'api/',
      version: '0.0',
      versionLink: 'https://github.com/sensoroni/sensoroni/releases/',
      license: '',
      licenseLink: 'https://raw.githubusercontent.com/sensoroni/sensoroni/master/LICENSE',
      papi: null,
      connectionTimeout: 5000,
      socket: null,
      subscriptions: [],
    },
    watch: {
      '$vuetify.theme.dark': 'saveLocalSettings',
    },
    methods: {
      log(msg) {
        console.log(msg);
      },
      async loadInfo() {
        try {
          const response = await this.papi.get('info');
          this.version = response.data.version;
          this.versionLink = "https://github.com/sensoroni/sensoroni/releases/tag/" + this.version;
          this.license = response.data.license;
        } catch (error) {
          this.showError(error);
        }
      },
      makeHeader(label, value) {
        return { text: label, value: value };
      },
      formatDateTime(date) {
        var formatted = this.i18n.dateUnknown;
        if (date) {
          const dateObj = moment(String(date));
          if (dateObj.isAfter('1000-01-01')) {
            formatted = dateObj.format(this.i18n.dateTimeFormat);
          }
        }
        return formatted;
      },
      formatTimestamp(date) {
        var formatted = this.i18n.dateUnknown;
        if (date) {
          const dateObj = moment(String(date));
          if (dateObj.isAfter('1000-01-01')) {
            formatted = dateObj.format(this.i18n.timestampFormat);
          }
        }
        return formatted;
      },
      formatDuration(duration) {
        if (duration) {
          return moment.duration(duration,"s").humanize();
        }
      },
      showError(msg) {
        this.error = true;
        this.message = msg;
      },

      startLoading() {
        this.loading = true;
        this.error = false;
      },
      stopLoading() {
        this.loading = false;
      },
      saveLocalSettings() {
        localStorage['settings.app.dark'] = this.$vuetify.theme.dark;
      },
      loadLocalSettings() {
        if (localStorage['settings.app.dark'] != undefined) {
          this.$vuetify.theme.dark = localStorage['settings.app.dark'] == "true";
        }
      },
      subscribe(kind, fn) {
        var list = this.subscriptions[kind];
        if (list == undefined) {
          list = [];
          this.subscriptions[kind] = list;
        }
        list.push(fn);
      },
      publish(kind, obj) {
        var listeners = this.subscriptions[kind];
        if (listeners) {
          listeners.forEach(function(listener) {
            listener(obj);
          });
        }
      },
      openWebsocket() {
        if (this.socket == null || this.socket.readyState == WebSocket.CLOSED) {
          const vm = this;
          this.log("WebSocket connecting to " + this.wsUrl);
          this.socket = new WebSocket(this.wsUrl);
          this.socket.onopen = function(evt) {
            vm.log("WebSocket connected");
          };
          this.socket.onclose = function(evt) {
            vm.log("WebSocket closed, will attempt to reconnect");
            vm.socket = null;
          };
          this.socket.onmessage = function(evt) {
            var msg = JSON.parse(evt.data);
            vm.publish(msg.Kind, msg.Object);
          };
          this.socket.onerror = function(evt) {
            vm.log("WebSocket failure: " + evt.data);
          };
        }
      },
    },
    created() {
      this.log("Initializing");
      this.loadLocalSettings();
      Vue.filter('formatDateTime', this.formatDateTime);
      Vue.filter('formatDuration', this.formatDuration);
      Vue.filter('formatTimestamp', this.formatTimestamp);
      $('#app')[0].style.display = "block";
      this.papi = axios.create({
        baseURL: this.apiUrl,
        timeout: this.connectionTimeout,
      });
      this.loadInfo();
      this.openWebsocket();
      window.setInterval(this.openWebsocket, this.connectionTimeout);
      this.log("Initialization complete");
    },
  });
});
