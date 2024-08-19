package utils

import "github.com/multisig-labs/gogopro-container/api/pkg/db"

type config struct {
	TrackSubnets string `json:"track-subnets"`
}

func GenerateConfig(subnets []db.Subnet) (config, error) {
	c := config{}
	for _, subnet := range subnets {
		c.TrackSubnets += subnet.SubnetID + ","
	}
	if len(c.TrackSubnets) > 0 {
		c.TrackSubnets = c.TrackSubnets[:len(c.TrackSubnets)-1]
	}
	return c, nil
}
