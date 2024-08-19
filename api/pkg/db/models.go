package db

import "gorm.io/gorm"

type Subnet struct {
	gorm.Model
	SubnetID string
	VMID     string
	Owner    string
}
