import fs from "fs";

const bolt = document.createElement("div");
bolt.setAttribute("w3-include-html", "bolt.html")


document.querySelector("body").innerHTML = fs.readFile('pages/bolt.html')