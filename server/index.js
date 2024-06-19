import reload from "reload";
import app from "./app.js";

const port = 3000;

app.listen(port, () => {
  console.log(`Express running: http://localhost:${port}`);
});

reload(app);
