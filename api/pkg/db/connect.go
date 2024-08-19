package db

import (
	"strings"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func connect(uri string) (*gorm.DB, error) {
	// if the url is empty, use in memory sqlite
	if uri == "" {
		return gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	}

	if strings.HasPrefix(uri, "/") || strings.HasPrefix(uri, "./") {
		return gorm.Open(sqlite.Open(uri), &gorm.Config{})
	}

	return gorm.Open(postgres.Open(uri), &gorm.Config{})
}

func New(uri string) (*gorm.DB, error) {
	db, err := connect(uri)
	if err != nil {
		return nil, err
	}

	// automigrate the schema
	err = db.AutoMigrate(&Subnet{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
