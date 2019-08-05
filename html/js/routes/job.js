// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU General Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

routes.push({ path: '/job/:jobId', name: 'job', component: { 
  template: '#page-job', 
  data() { return { 
    i18n: i18n,
    job: {},
    packetView: 'hex',
    packetsLoading: false,
    search: '',
    expandAll: false,
    captureLayout: 'packets',
    packets: [],
    headers: [
      { text: i18n.number, value: 'number' },
      { text: i18n.timestamp, value: 'timestamp' },
      { text: i18n.type, value: 'type' },
      { text: i18n.srcIp, value: 'srcIp' },
      { text: i18n.dstIp, value: 'dstIp' },
      { text: i18n.flags, value: 'flags' },
      { text: i18n.length, value: 'length' },
    ],
    pagination: {'sortBy': 'number', 'descending': false},
    rowsPerPageOptions: [10,50,250,1000],
    count: 500,
  }},
  created() { 
    Vue.filter('formatPacketView', this.formatPacketView);
    this.loadData() 
  },
  watch: { 
    '$route': 'loadData',
    'packets': 'packetsUpdated'
  },
  methods: {
    getPacketClass(packet) {
      var cls = "default";
      if (packet.srcIp == this.job.filter.srcIp && packet.srcPort == this.job.filter.srcPort) {
        cls = "src";
      } else if (packet.srcIp == this.job.filter.dstIp && packet.srcPort == this.job.filter.dstPort) {
        cls = "dst";
      }
      return cls
    },
    expandPackets(enabled) {
      this.expandAll = enabled;
      for (var i = 0; i < this.packets.length; i++) {
        this.$set(this.$refs.packetTable.expanded, this.packets[i].number, enabled)
      }
      if (!enabled) {
        this.captureLayout = 'packets';
      }
    },
    captureLayoutAsStream() {
      this.expandPackets(true);
      this.pagination['sortBy'] = 'number';
      this.pagination['descending'] = false;
    },
    packetsUpdated() {
      if (this.expandAll) {
        this.expandPackets(true);
      }
    },
    downloadUrl() {
      return data.apiUrl + "stream?jobId=" + this.job.id;
    },
    showAll() {
      
    },
    async loadPackets() {
      this.packetsLoading = true;
      try {
        const response = await papi.get('packets', { params: {
          jobId: this.$route.params.jobId,
          offset: this.packets.length,
          count: this.count
        }});
        if (response.data) {
          this.packets = this.packets.concat(response.data);
        }
      } catch (error) {
        if (error.response != undefined && error.response.status == 404) {
        } else {
          methods.showError(error);
        }
      }
      this.packetsLoading = false;
    },
    async loadData() {
      methods.startLoading();
      try {
        const response = await papi.get('job', { params: {
            jobId: this.$route.params.jobId
        }});
        this.job = response.data;
        this.loadPackets();
      } catch (error) {
        if (error.response != undefined && error.response.status == 404) {
          methods.showError(i18n.jobNotFound);
        } else {
          methods.showError(error);
        }
      }
      methods.stopLoading();
      methods.subscribe("job", this.updateJob);
    },
    updateJob(job) {
      this.job = job;
    },
    formatPacketView(packet) {
      var view = "";
      if (packet.payload) {
        var bytes = atob(packet.payload);
        if (this.captureLayout != 'packets' && packet.payloadOffset > 0) {
          bytes = bytes.slice(packet.payloadOffset);
        }
        if (this.packetView == 'hex') {
          view = this.formatHexView(bytes);
        } else {
          view = this.formatAsciiView(bytes);
        }
      }
      return view;
    },
    formatHexView(input) {
      var view = "";
      var ascii = "";
      for (var idx = 0, len = input.length; idx < len; idx++) {
        view += (idx % 16 == 0 ? ("" + idx).padStart(4,"0") + "  " : "");
        var code = input.charCodeAt(idx);
        ascii += (code < 32 || code > 126) ? "." : input[idx];
        var hex = code.toString(16).toUpperCase();
        if (hex.length < 2) hex = "0" + hex;
        view += hex
        var idxMod16 = (idx+1) % 16;
        if (idxMod16 == 0 || (idx+1) == len) {
          if (idxMod16 != 0) {
            for (var i = 0; i < (16-idxMod16); i++) {
              view += "   ";
            }
            if (idxMod16 < 9) view += " ";
          }
          view += "   " + ascii + "\n";
          ascii = "";
        } else {
          view += ((idx+1) % 8 == 0 ? "  " : " ");
        }
      }
      return view;
    },
    formatAsciiView(input) {
      var view = "";
      for (var idx = 0, len = input.length; idx < len; idx++) {
        var code = input.charCodeAt(idx);
        view += (code < 32 || code > 126) && code != 13 && code != 10 ? "." : input[idx];
      }
      return view;
    }
  }
}});

