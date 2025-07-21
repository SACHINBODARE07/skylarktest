import React from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"

// Grab #root or create it if it’s missing
const container =
  document.getElementById("root") ??
  (() => {
    const el = document.createElement("div")
    el.id = "root"
    document.body.appendChild(el)
    return el
  })()

const root = ReactDOM.createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
