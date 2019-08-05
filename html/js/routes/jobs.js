// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU General Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

routes.push({ path: '/', name: 'jobs', component: { 
  template: '#page-jobs', 
  data() { return { 
    i18n: i18n,
    jobs: [],
    headers: [
      { text: i18n.id, value: 'id' },
      { text: i18n.dateQueued, value: 'createTime' },
      { text: i18n.dateUpdated, value: 'updateTime' },
      { text: i18n.sensorId, value: 'sensorId' },
      { text: i18n.status, value: 'status' },
    ],
    pagination: {'sortBy': 'id', 'descending': true, 'rowsPerPage': 10},
    dialog: false,
    form: {
      valid: false,
      sensorId: null,
      srcIp: null,
      srcPort: null,
      dstIp: null,
      dstPort: null,
      beginTime: null,
      endTime: null,
    },
  }},
  created() { 
    Vue.filter('formatJobStatus', this.formatJobStatus);
    Vue.filter('formatJobUpdateTime', this.formatJobUpdateTime);
    this.loadData()
  },
  watch: { 
    '$route': 'loadData'
  },
  methods: {
    async loadData() {
      methods.startLoading();
      try {
        const response = await papi.get('jobs');
        this.jobs = response.data;
      } catch (error) {
        methods.showError(error);
      }
      methods.stopLoading();
      methods.subscribe("job", this.updateJob);
    },
    updateJob(job) {
      for (var i = 0; i < this.jobs.length; i++) {
        if (this.jobs[i].id == job.id) {
          this.$set(this.jobs, i, job);
          break;
        }
      }
    },
    submitAddJob(event) {
      this.addJob(this.form.sensorId, this.form.srcIp, this.form.srcPort, this.form.dstIp, this.form.dstPort, this.form.beginTime, this.form.endTime);
      this.dialog = false;
      this.form.sensorId = null;
      this.form.srcIp = null;
      this.form.srcPort = null;
      this.form.dstIp = null;
      this.form.dstPort = null;
      this.form.beginTime = null;
      this.form.endTime = null;
    },
    async addJob(sensorId, srcIp, srcPort, dstIp, dstPort, beginTime, endTime) {
      try {
        if (!sensorId) {
          methods.showError(this.i18n.sensorIdRequired);
        } else {
          const response = await papi.post('job', {  
            sensorId: sensorId,
            filter: {
              srcIp: srcIp,
              srcPort: parseInt(srcPort),
              dstIp: dstIp,
              dstPort: parseInt(dstPort),
              beginTime: new Date(beginTime),
              endTime: new Date(endTime)
            }
          });
          this.jobs.push(response.data);
        }
      } catch (error) {
         methods.showError(error);
      }
    },
    formatJobUpdateTime(job) {
      var time = "";
      if (job.status == 1) {
        time = job.completeTime;
      } else if (job.status == 2) {
        time = job.failTime;
      }
      return time;
    },
    formatJobStatus(job) {
      var status = i18n.pending;
      if (job.status == 1) {
        status = i18n.completed;
      } else if (job.status == 2) {
        status = i18n.incomplete;
      }
      return status;
    }
  }
}});  
