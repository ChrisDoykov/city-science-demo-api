import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";
import * as url from "url";
import AWS from "aws-sdk";
import { json2csv } from "json-2-csv";
import { env } from "../../utils.js";
import { Op } from "sequelize";
import { GraphQLError } from "graphql";

// Query used to import the data from the original CSV into Postgres
export async function importDataFromCsv(_, __, { db, isAuth }) {
  if (isAuth) {
    const __filename = url.fileURLToPath(import.meta.url);
    const filePath = path.join(
      path.dirname(__filename),
      "./dft_traffic_counts_aadf_by_direction.csv"
    );
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", async (row) => {
        // Create a new record in your Sequelize model for each row in the CSV
        const modelData = {};
        Object.keys({
          Count_point_id: 0,
          Year: 0,
          Region_id: 0,
          Region_name: "",
          Region_ons_code: 0,
          Local_authority_id: 0,
          Local_authority_name: "",
          Local_authority_code: "",
          Road_name: "",
          Road_category: "",
          Road_type: "",
          Start_junction_road_name: "",
          End_junction_road_name: "",
          Easting: 0,
          Northing: 0,
          Latitude: 0.0,
          Longitude: 0.0,
          Link_length_km: 0.0,
          Link_length_miles: 0.0,
          Estimation_method: "",
          Estimation_method_detailed: "",
          direction_of_travel: "",
          Pedal_cycles: 0,
          Two_wheeled_motor_vehicles: 0,
          Cars_and_taxis: 0,
          Buses_and_coaches: 0,
          LGVs: 0,
          HGVs_2_rigid_axle: 0,
          HGVs_3_rigid_axle: 0,
          HGVs_4_or_more_rigid_axle: 0,
          HGVs_3_or_4_articulated_axle: 0,
          HGVs_5_articulated_axle: 0,
          HGVs_6_articulated_axle: 0,
          All_HGVs: 0,
          All_motor_vehicles: 0,
        }).map((key) => {
          modelData[key] = row[key];
        });
        await db.TrafficData.create(modelData);
      })
      .on("end", () => {
        console.log("CSV file successfully processed.");
      });
  }
}

export async function getTrafficDataBetweenYears(
  _,
  { fromYear = 2016, toYear = new Date().getFullYear() },
  { db, isAuth }
) {
  if (isAuth) {
    /* In a typical Express API you could use res.download for direct file downloads */

    // res.download(
    //   path.join(path.dirname(__filename), "../../data/hello.txt"),
    //   "hello.txt",
    //   function (error) {
    //     console.log("Failed to locate file: ", error);
    //   }
    // );

    // Instantiate S3 client
    const s3 = new AWS.S3({
      apiVersion: "2006-03-01",
      accessKeyId: env("FILEBASE_KEY"),
      secretAccessKey: env("FILEBASE_SECRET"),
      endpoint: "https://s3.filebase.com",
      region: "us-east-1",
      s3ForcePathStyle: true,
    });

    // Each year range maps to exactly one key
    const KEY = `traffic/${fromYear}-${toYear}.csv`;
    const contentType = "text/csv";

    // Initially try and check if we already have this data generated
    // If we do -> fetch the record and return it
    const record = await db.Record.findOne({
      where: {
        key: KEY,
      },
    });

    if (record) return record;

    // If we don't -> fetch JSON from Postgres
    const trafficData = await db.TrafficData.findAll({
      where: {
        Year: {
          [Op.and]: {
            [Op.gte]: fromYear,
            [Op.lte]: toYear,
          },
        },
      },
    });

    // Convert to CSV
    const csv = await json2csv(trafficData);

    // Upload to S3
    const uploadParams = {
      Bucket: env("FILEBASE_BUCKET_NAME"),
      Key: KEY,
      ContentType: contentType,
      Body: csv,
      ACL: "public-read",
    };

    const request = s3.putObject(uploadParams);

    // Retrieve the CID of the file to use in the end link
    let cid;
    request.on("httpHeaders", async (_, headers) => {
      cid = headers["x-amz-meta-cid"];
    });

    // Promisify S3 request and return the resolution
    const result = await new Promise((resolve) => {
      request.send(async (error, data) => {
        if (error) {
          console.error("Failed to upload data to S3: ", error);
          resolve(null);
        } else if (data) {
          // Create the new record in the DB in order to not calculate again
          const URL = `https://ipfs.filebase.io/ipfs/${cid}`;
          const newRecord = await db.Record.create({
            key: KEY,
            url: URL,
          });
          resolve(newRecord);
        }
      });
    });

    return result;
  }
  throw new GraphQLError(`Please authenticate first!`, {
    extensions: { code: "NO_AUTH" },
  });
}
