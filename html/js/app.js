// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU General Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

const i18n = getLocalizedTranslations(navigator.language);

const data = {
  i18n: i18n,
  loading: false,
  error: false,
  message: "",
  toolbar: null,
  apiUrl: location.origin + location.pathname + 'api/',
  wsUrl: (location.protocol == 'https:' ?  'wss://' : 'ws://') + location.host + location.pathname + 'ws',
  version: '0.0',
  versionLink: 'https://github.com/sensoroni/sensoroni/releases/',
  license: '',
  licenseLink: 'https://raw.githubusercontent.com/sensoroni/sensoroni/master/LICENSE',
  connectionTimeout: 5000,
  ws: null,
  subscriptions: [],
};
const routes = [];

const methods = {};

methods.loadInfo = async function() {
  try {
    const response = await papi.get('info');
    data.version = response.data.version;
    data.versionLink = "https://github.com/sensoroni/sensoroni/releases/tag/" + data.version;
    data.license = response.data.license;
  } catch (error) {
    methods.showError(error);
  }
}

methods.formatDateTime = function(date) {
  var formatted = i18n.dateUnknown;
  if (date) {
    const dateObj = moment(String(date));
    if (dateObj.isAfter('1000-01-01')) {
      formatted = dateObj.format(data.i18n.dateTimeFormat);
    }
  }
  return formatted;
}

methods.formatTimestamp = function(date) {
  var formatted = i18n.dateUnknown;
  if (date) {
    const dateObj = moment(String(date));
    if (dateObj.isAfter('1000-01-01')) {
      formatted = dateObj.format(data.i18n.timestampFormat);
    }
  }
  return formatted;
}

methods.formatDuration = function(duration) {
  if (duration) {
    return moment.duration(duration,"s").humanize();
  }
}

methods.showError = function(msg) {
  data.error = true;
  data.message = msg;
};

methods.log = function(msg) {
  console.log(msg);
}

methods.startLoading = function() {
  data.loading = true;
  data.error = false;
};

methods.stopLoading = function() {
  data.loading = false;
};

methods.subscribe = function(kind, fn) {
  var list = data.subscriptions[kind];
  if (list == undefined) {
    list = [];
    data.subscriptions[kind] = list;
  }
  list.push(fn);
};

methods.publish = function(kind, obj) {
  var listeners = data.subscriptions[kind];
  if (listeners) {
    listeners.forEach(function(listener) {
      listener(obj);
    });
  }
}

methods.openWebsocket = function() {
  if (data.ws == null || data.ws.readyState == WebSocket.CLOSED) {
    methods.log("WebSocket connecting to " + data.wsUrl);
    data.ws = new WebSocket(data.wsUrl);
    data.ws.onopen = function(evt) {
      methods.log("WebSocket connected");
    };
    data.ws.onclose = function(evt) {
      methods.log("WebSocket closed, will attempt to reconnect");
      data.ws = null;
    };
    data.ws.onmessage = function(evt) {
      var msg = JSON.parse(evt.data);
      methods.publish(msg.Kind, msg.Object);
    };
    data.ws.onerror = function(evt) {
      methods.log("WebSocket failure: " + evt.data);
    };
  }
};

$(document).ready(function() {
  Vue.filter('formatDateTime', methods.formatDateTime);
  Vue.filter('formatDuration', methods.formatDuration);
  Vue.filter('formatTimestamp', methods.formatTimestamp);
  const vmHead = new Vue({
    el: 'head',
    data: data
  });

  const vuetifySettings = {
    theme: {
      dark: true,
      options: {
        customProperties: true,
      },
    },
  };

  const router = new VueRouter({ routes });
  const vmMain = new Vue({
    el: '#app',
    vuetify: new Vuetify(vuetifySettings),
    router,
    data,
    methods
  });
  $('#app')[0].style.display = "block";
  methods.loadInfo();

  methods.openWebsocket();
  window.setInterval(methods.openWebsocket, data.connectionTimeout);
});

const papi = axios.create({
  baseURL: data.apiUrl,
  timeout: data.connectionTimeout
});
