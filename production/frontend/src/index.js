import React from 'react';
import { App } from "./components/app.js";
import './bootstrap.min.css';

import { createRoot } from "react-dom/client";

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App/>);
