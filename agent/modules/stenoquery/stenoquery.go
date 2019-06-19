// Copyright 2019 Jason Ertel (jertel). All rights reserved.
//
// This program is distributed under the terms of version 2 of the
// GNU General Public License.  See LICENSE for further details.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

package stenoquery

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"time"
	"github.com/apex/log"
	"github.com/sensoroni/sensoroni/agent"
	"github.com/sensoroni/sensoroni/model"
	"github.com/sensoroni/sensoroni/module"
)

const DEFAULT_EXECUTABLE_PATH = "stenoread"
const DEFAULT_PCAP_OUTPUT_PATH = "/nsm/pcapout"
const DEFAULT_PCAP_INPUT_PATH = "/nsm/pcap"
const DEFAULT_EPOCH_REFRESH_MS = 120000
const DEFAULT_TIMEOUT_MS = 1200000

type StenoQuery struct {
	config						module.ModuleConfig
	executablePath		string
	pcapOutputPath		string
	pcapInputPath			string
	agent							*agent.Agent
	epochTimeTmp			time.Time
	epochTime					time.Time
	epochRefreshTime	time.Time
	epochRefreshMs		int
	timeoutMs					int
}

func NewStenoQuery(agt *agent.Agent) *StenoQuery {
	return &StenoQuery {
		agent: agt,
	}
}

func (sqmodule *StenoQuery) PrerequisiteModules() []string {
	return nil
}

func (sqmodule *StenoQuery) Init(cfg module.ModuleConfig) error {
	var err error
	sqmodule.config = cfg
	sqmodule.executablePath = module.GetStringDefault(cfg, "executablePath", DEFAULT_EXECUTABLE_PATH)
	sqmodule.pcapOutputPath = module.GetStringDefault(cfg, "pcapOutputPath", DEFAULT_PCAP_OUTPUT_PATH)
	sqmodule.pcapInputPath = module.GetStringDefault(cfg, "pcapInputPath", DEFAULT_PCAP_INPUT_PATH)
	sqmodule.epochRefreshMs = module.GetIntDefault(cfg, "epochRefreshMs", DEFAULT_EPOCH_REFRESH_MS)
	sqmodule.timeoutMs = module.GetIntDefault(cfg, "timeoutMs", DEFAULT_TIMEOUT_MS)
	if sqmodule.agent == nil {
		err = errors.New("Unable to invoke JobMgr.AddJobProcessor due to nil agent")
	} else {
		sqmodule.agent.JobMgr.AddJobProcessor(sqmodule)
	}
	return err
}

func (sqmodule *StenoQuery) Start() error {
	return nil
}

func (sqmodule *StenoQuery) Stop() error {
	return nil
}

func (sqmodule *StenoQuery) IsRunning() bool {
	return false
}


func (steno *StenoQuery) ProcessJob(job *model.Job, reader io.ReadCloser) (io.ReadCloser, error) {
	var err error
	if job.Filter == nil || job.Filter.EndTime.Before(steno.GetDataEpoch()) {
		err = errors.New("No data available for the requested dates")
	} else {
		job.FileExtension = "pcap"

		beginTime := job.Filter.BeginTime.Format(time.RFC3339)
		endTime := job.Filter.EndTime.Format(time.RFC3339)

		query := fmt.Sprintf("before %s and after %s and host %s and host %s and port %d and port %d",
												endTime, beginTime, job.Filter.SrcIp, job.Filter.DstIp, job.Filter.SrcPort, job.Filter.DstPort)

		pcapFilepath := fmt.Sprintf("%s/%d.%s", steno.pcapOutputPath, job.Id, job.FileExtension)

		log.WithField("jobId", job.Id).Info("Processing pcap export for job")

		ctx, cancel := context.WithTimeout(context.Background(), time.Duration(steno.timeoutMs) * time.Millisecond)
		defer cancel()
		cmd := exec.CommandContext(ctx, steno.executablePath, query, "-w", pcapFilepath)
		var output []byte
		output, err = cmd.CombinedOutput()
		log.WithFields(log.Fields {
			"executablePath": steno.executablePath,
			"query": query,
			"output": output,
			"pcapFilepath": pcapFilepath,
			"err": err,
			}).Debug("Executed stenoread")
		if err == nil {
			var file *os.File
			file, err = os.Open(pcapFilepath)
			if err == nil {
				reader = file
			}
		}
	}
	return reader, err
}

func (steno *StenoQuery) GetDataEpoch() time.Time {
	now := time.Now()
	refreshDuration := time.Duration(steno.epochRefreshMs) * time.Millisecond
	if now.Sub(steno.epochRefreshTime) > refreshDuration {
		steno.epochTimeTmp = now
		err := filepath.Walk(steno.pcapInputPath, steno.updateEpochTimeTmp)
		if err != nil {
			log.WithError(err).WithField("pcapInputPath", steno.pcapInputPath)
		} else {
			steno.epochTime = steno.epochTimeTmp
		}
		steno.epochRefreshTime = now
	}
	return steno.epochTime
}

func (steno *StenoQuery) updateEpochTimeTmp(path string, info os.FileInfo, err error) error {
	if err != nil {
		log.WithError(err).WithField("path", path).Error("Unable to access path while updating epoch")
		return err
	} 
	if !info.IsDir() && info.Size() > 0 && info.ModTime().Before(steno.epochTimeTmp) {
		steno.epochTimeTmp = info.ModTime()
	}
	return nil
}