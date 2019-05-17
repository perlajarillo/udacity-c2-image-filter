import express from "express";
import bodyParser from "body-parser";
import { spawn } from "child_process";

(async () => {
  const app = express();
  const port = 8082; // default port to listen

  app.use(bodyParser.json());

  //VERY BAD
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
  });

  // Root URI call
  app.get("/", async (req, res) => {
    const pythonProcess = spawn("python", ["src/image_filter.py"]);
    if (pythonProcess !== undefined) {
      pythonProcess.stdout.on("data", data => {
        // Do something with the data returned from python script
        console.log(data.toString());
      });
    }

    res.send("pythonic");
  });

  // end point for image processing
  app.post("/imagetoprocess", (req, res) => {
    //body payload for our variables
    let { image_url, upload_image_signedUrl } = req.body;
    const https = require("https");
    if (!image_url) {
      // respond with an error one of the parameters are incorrect
      return res.status(422).send(`image_url is required`);
    }
    let { token } = req.headers;
    if (!token) {
      res.status(401).send("You are not authorized to do this!");
    } else {
      if (upload_image_signedUrl) {
        https
          .get(image_url, resp => {
            let image = "";
            // A chunk of data has been recieved.
            resp.on("image", chunk => {
              image += chunk;
            });
            resp.on("end", () => {
              res.status(200).send(image);
            });
          })
          .on("error", err => {
            console.log("Error: " + err.message);
          });
      } else {
        const pythonProcess = spawn("python", ["src/image_filter.py"]);
        if (pythonProcess !== undefined) {
          pythonProcess.stdout.on("data", data => {
            // Do something with the data returned from python script
            let processResponse = data.process(
              "testFilter.jpg",
              image_url,
              upload_image_signedUrl
            );
            if (processResponse) {
              res.status(200).send("The image was processed!");
            } else {
              res.status(422).send("The image couldn't be processed!");
            }
          });
        }
      }
    }
  });

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();
