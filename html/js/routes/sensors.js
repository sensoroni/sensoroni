// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU General Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

routes.push({ path: '/sensors', name: 'sensors', component: {
  template: '#page-sensors',
  data() { return {
    i18n: i18n,
    sensors: [],
    headers: [
      { text: i18n.id, value: 'id' },
      { text: i18n.description, value: 'description' },
      { text: i18n.version, value: 'version' },
      { text: i18n.dateOnline, value: 'onlineTime' },
      { text: i18n.dateUpdated, value: 'updateTime' },
      { text: i18n.dateDataEpoch, value: 'epochTime' },
      { text: i18n.uptime, value: 'uptimeSeconds' },
    ],
    sortBy: 'id',
    sortDesc: false,
    itemsPerPage: 10,
  }},
  created() { this.loadData() },
  watch: {
    '$route': 'loadData'
  },
  methods: {
    async loadData() {
      methods.startLoading();
      try {
        const response = await papi.get('sensors');
        this.sensors = response.data;
      } catch (error) {
        methods.showError(error);
      }
      methods.stopLoading();
      methods.subscribe("sensor", this.updateSensor);
    },
    updateSensor(sensor) {
      for (var i = 0; i < this.sensors.length; i++) {
        if (this.sensors[i].id == sensor.id) {
          this.$set(this.sensors, i, sensor);
          break;
        }
      }
    }
  }
}});
