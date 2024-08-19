package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
	"github.com/multisig-labs/gogopro-container/api/pkg/db"
	"github.com/multisig-labs/gogopro-container/api/pkg/utils"
)

func main() {
	// Get the DATABASE_URI environment variable
	databaseURI := os.Getenv("DATABASE_URI")

	fmt.Println("DATABASE_URI:", databaseURI)

	// Initialize the database
	database, err := db.New(databaseURI)
	if err != nil {
		panic("Failed to connect to the database: " + err.Error())
	}

	e := echo.New()

	// Root endpoint
	e.GET("/", func(c echo.Context) error {
		return c.String(http.StatusOK, "Hello, World!")
	})

	// New GET endpoint to query and return the list of subnets
	e.GET("/subnets", func(c echo.Context) error {
		var subnets []db.Subnet
		result := database.Find(&subnets)
		if result.Error != nil {
			return c.String(http.StatusInternalServerError, "Failed to fetch subnets: "+result.Error.Error())
		}
		return c.JSON(http.StatusOK, subnets)
	})

	e.GET("/config", func(c echo.Context) error {
		var subnets []db.Subnet
		result := database.Find(&subnets)
		if result.Error != nil {
			return c.String(http.StatusInternalServerError, "Failed to fetch subnets: "+result.Error.Error())
		}

		// Encode the subnets
		config, err := utils.GenerateConfig(subnets)
		if err != nil {
			return c.String(http.StatusInternalServerError, "Failed to generate config: "+err.Error())
		}

		return c.JSON(http.StatusOK, config)
	})

	e.GET("/encoded", func(c echo.Context) error {
		var subnets []db.Subnet
		result := database.Find(&subnets)
		if result.Error != nil {
			return c.String(http.StatusInternalServerError, "Failed to fetch subnets: "+result.Error.Error())
		}

		// Encode the subnets
		config, err := utils.GenerateConfig(subnets)
		if err != nil {
			return c.String(http.StatusInternalServerError, "Failed to generate config: "+err.Error())
		}

		encoded, err := utils.JSONToBase64(config)
		if err != nil {
			return c.String(http.StatusInternalServerError, "Failed to encode config: "+err.Error())
		}

		return c.String(http.StatusOK, encoded)
	})

	e.Logger.Fatal(e.Start(":8080"))
}
