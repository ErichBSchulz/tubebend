import { setScale } from "./state.js";
import { init, redraw } from "./ui.js";

// Canvas scaling parameters
const scale = { factor: 5, xOffset: -100, yOffset: -100 };
setScale(scale);

// Initialize the application
init();
