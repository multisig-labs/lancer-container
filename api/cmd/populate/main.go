package main

import (
	"fmt"
	"os"

	"github.com/multisig-labs/gogopro-container/api/pkg/db"
	"github.com/multisig-labs/gogopro-container/api/pkg/utils"
)

func main() {
	// Get the DATABASE_URI environment variable
	databaseURI := os.Getenv("DATABASE_URI")

	fmt.Println("DATABASE_URI:", databaseURI)

	// open the database
	database, err := db.New(databaseURI)
	if err != nil {
		panic(err)
	}

	// open the subnets file at testnet.json

	rawSubnets, err := utils.LoadSubnets("../testnet.json")
	if err != nil {
		panic(err)
	}

	// for each subnet make a new DB entry
	for _, rawSubnet := range rawSubnets {
		subnet := db.Subnet{
			Owner:    rawSubnet.Name,
			SubnetID: rawSubnet.SubnetID,
			VMID:     rawSubnet.VMID,
		}

		result := database.Create(&subnet)
		if result.Error != nil {
			panic(result.Error)
		}
	}

	fmt.Println("Subnets populated successfully")
}
