package utils

import (
	"encoding/json"
	"fmt"
	"os"
)

type subnet struct {
	Name     string `json:"name"`
	SubnetID string `json:"subnetId"`
	VMID     string `json:"vmId"`
}

type subnetFile struct {
	Subnets []subnet `json:"subnets"`
}

func LoadSubnets(filename string) ([]subnet, error) {
	// Read the file
	file, err := os.ReadFile(filename)

	if err != nil {
		return nil, fmt.Errorf("error reading file: %v", err)
	}

	// Unmarshal the JSON
	var subnets subnetFile
	err = json.Unmarshal(file, &subnets)
	if err != nil {
		return nil, fmt.Errorf("error unmarshaling JSON: %v", err)
	}

	return subnets.Subnets, nil
}
