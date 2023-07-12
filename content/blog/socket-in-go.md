---
title: "Socket Programming in Go"
date: 2023-06-18T10:15:19+05:30
tags: ["Go", "Socket Programming"]
draft: true
---

The usual way of making an interaction between a client and a server is that the client makes HTTP requests and a response is sent by the server. What if the browser needs a persistent connection? WebSockets is the answer.

<!--more-->

### WebSockets Server

A WebSockets server is an HTTP server which accepts TCP connections and handles the HTTP requests on the TCP connection. To handle WebSockets requests, we register a different handler - a WebSockets handler.

```Go
func main() {
    http.Handle("/", websocket.Handler(WSHandler))
    err := http.ListenAndServe(":8000", nil)
    checkError(err)
}
```

### Go Package

Go has a package for websockets. Use the command `go get golang.org/x/net/websocket` to get that package.

### Message Object

HTTP is a stream protocol. WebSockets are frame-based. Block of data(of any size) is sent as set of frames.

The `websocket` package contains `Message` object for this use. It has two methods - Send & Receive, that take a WebSocket as first parameter. The second parametr is address of variable to store data in, or the data to be sent.

### What are WebSockets?

WebSockets are HTTP connections that live until the connection is killed by either the client or the server. There is a full-duplex communication between the client and the server. Just one TCP connection is used and all the communication is done over it.

### Start the application
