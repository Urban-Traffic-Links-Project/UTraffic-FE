import "leaflet/dist/leaflet.css";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import { QueryProvider } from "./providers/QueryProvider";
import { ThemeProvider } from "./providers/ThemeProvider";

export function AppRoot() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <QueryProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}
