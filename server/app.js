import chalk from "chalk";
import express from "express";
import * as fs from "fs";
import { Liquid } from "liquidjs";
import { XMLParser, XMLBuilder, XMLValidator } from "fast-xml-parser";

const __dirname = import.meta.dirname;

const arrayNodes = ["blocklist", "textlist"];

const mapData = (doc, onlyValue) =>
  Object.entries(doc).map(([nodeName, content]) => {
    let { name, value } = content;

    if (onlyValue) {
      return Array.isArray(content)
        ? content.map(({ value }) => value)
        : content.value;
    } else if (!name) {
      console.log(chalk.red("⚠ Un élément de niveau racine n'a pas de nom"));
    }

    if (nodeName == "bool") {
      return {
        [name]: value.value,
      };
    }

    if (nodeName == "enum") {
      const defaults = value.filter((val) => !!val.default)?.[0].default;
      return {
        [name]: value.filter((val) => val.id == defaults)[0]?.value,
      };
    }

    delete content.name;

    if (arrayNodes.includes(nodeName)) {
      return {
        [name]: mapData(content, true)[0],
      };
    }

    return {
      [name]: !value ? mapData(content, arrayNodes.includes(nodeName)) : value,
    };
  });

// get content & convert
const content = fs.readFileSync("./data/data.xml");
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
});
let data = parser.parse(content);
data = Object.assign({}, ...mapData(data.document));

const app = express();
const engine = new Liquid({
  root: __dirname, // for layouts and partials
  extname: ".liquid",
});

app.engine("liquid", engine.express()); // register liquid engine
app.set("views", ["./partials", "./views"]); // specify the views directory
app.set("view engine", "liquid"); // set to default

app.get("/", function (req, res) {
  res.render("index", data);
});

export default app;
