// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU Public License.  See LICENSE for further details.
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
  dark: true,
  toolbar: null,
  apiUrl: '/api/',
  version: '0.0',
  versionLink: 'https://sensoroni.com/releases',
  license: '',
  licenseLink: 'https://sensoroni.com/license',
};
const routes = [];

const methods = {};

methods.loadInfo = async function() {
  try {
    const response = await papi.get('info');
    data.version = response.data.version;
    data.versionLink = "https://sensoroni.com/releases/" + data.version;
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

methods.startLoading = function() {
  data.loading = true;
  data.error = false;
};

methods.stopLoading = function() {
  data.loading = false;
};

$(document).ready(function() {
  Vue.filter('formatDateTime', methods.formatDateTime);
  Vue.filter('formatDuration', methods.formatDuration);
  Vue.filter('formatTimestamp', methods.formatTimestamp);
  const vmHead = new Vue({
    el: 'head',
    data: data
  });

  const router = new VueRouter({ routes });
  const vmMain = new Vue({
    el: '#app',
    router,
    data,
    methods
  });
  $('#app')[0].style.display = "block";
  methods.loadInfo();
});

const papi = axios.create({
  baseURL: data.apiUrl,
  timeout: 5000
});
