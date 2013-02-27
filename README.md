dynamocmd
==========
Command line client for Amazon DynamoDB. V0.1. 

Why? - primarily a tool to aid with updating throughputs on Amazon DynamoDB. Amazon DynamoDb allows throughput modification on the following basis:

* Throughput may be incremented by 100% on any one update
* Takes ~60 seconds for a throughput update to process
* Throughput may only be decremented twice in any 24 hour period

Whilst DynamoDB rocks, sometimes you need to adjust throughputs without having to mess about with the web interface. dynamocmd automates this process to save time and money!

## Installation

	npm install -g dynamocmd

## Usage

	dynamocmd -c <config file> [-r <region>] [-c <command>]

### configuration file

As per the AWS node.js SDK, the config file contains a json with the following elements:

	{ "accessKeyId": "YOUR ACCESS KEY", 
	  "secretAccessKey": "YOUR SECRET ACCESS KEY", 
	  "region": "us-east-1"}

### Interactive

	dynamocmd -c <config file>
	
Start dynamocmd in interactive mode. Available commands:

`dynamo> help` show interactive help

`dynamo> list` list all tables in for account in region

`dynamo> describe <table name>` describe the named table

`query <table name> <pkey> <range comparison> <rkey>` run a query and return the first 20 results into the node repl

`dynamo> throughput <table name> <read> <write>` set the table read and write throughputs

`dynamo> exit` to quit

### Examples

`dynamo> throughput mytable 2048 512` will set the table throughput values to 2048 read, 512 write.

`dynamo> throughput mytable 1 1` Will set a table back to idle.

### Scripted

	dynamocmd -c <config file> -c 'throughput mytable 2048 512' 

Will set the table throughput to the specified values and exit.


