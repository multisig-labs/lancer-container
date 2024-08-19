package utils

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
)

func JSONToBase64(jsonObj any) (string, error) {
	// Convert the JSON object to a JSON string
	jsonBytes, err := json.Marshal(jsonObj)
	if err != nil {
		return "", fmt.Errorf("error marshaling JSON: %v", err)
	}

	// Encode the JSON string into Base64
	base64Str := base64.StdEncoding.EncodeToString(jsonBytes)
	return base64Str, nil
}
