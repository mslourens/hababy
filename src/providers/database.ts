/*
  Generated class for the Database provider.

  See https://angular.io/docs/ts/latest/guide/dependency-injection.html
  for more info on providers and Angular 2 DI.
*/

import { Injectable } from '@angular/core';
import {SQLite} from 'ionic-native';

@Injectable()
export class Database {

    private storage: SQLite;
    private isOpen: boolean;

    public constructor() {
        if (!this.isOpen) {
            this.storage = new SQLite();

            this.storage.openDatabase({name: "data.db", location: "default"})
            .then( (data) => {
                this.isOpen = true;

                return this.storage.executeSql("CREATE TABLE IF NOT EXISTS symptom_log (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, symptom1 INTEGER, symptom2 INTEGER, symptom3 INTEGER, notes TEXT)", {});
            })
            .then((data) => {
                console.log("TABLE CREATED: ", data);

                return this.storage.executeSql("CREATE TABLE IF NOT EXISTS patient_history (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, problems TEXT)", {});
            })
            .catch((error) => {
                  console.error("Unable to execute sql", error);
            });
      }
    }

    // add up to three symptoms plus notes
    public addSymptomsToLog(symptoms, notes) {

        return new Promise((resolve, reject) => {
          var date = new Date();
          var formattedDate = date.toUTCString().split(' ').slice(0, 5).join(' ');

          var symptom1 = symptoms.length > 0 ? symptoms[0] : "";
          var symptom2 = symptoms.length > 1 ? symptoms[1] : "";
          var symptom3 = symptoms.length > 2 ? symptoms[2] : "";

          this.storage.executeSql("INSERT INTO symptom_log (timestamp, symptom1, symptom2, symptom3, notes) VALUES (?, 1, 0, 1, ?)", [formattedDate, notes]).then((data) => {
              resolve(data);
          }, (error) => {
              reject(error);
          });
        });

    }

    public updateSymptom(timestamp, notes)
    {
        return new Promise((resolve, reject) => {
          this.storage.executeSql("UPDATE symptom_log SET notes = :notes WHERE timestamp = :timestamp", [notes, timestamp]).then((data) => {
              let symptom_log = [];
              for(var i = 0; i < data.rows.length; i++) {
                  symptom_log.push({timestamp: data.rows.item(i).timestamp, symptom1: data.rows.item(i).symptom1, symptom2: data.rows.item(i).symptom2, symptom3: data.rows.item(i).symptom3, notes: data.rows.item(i).notes});
              }

              resolve(symptom_log);
          }, (error) => {
              reject(error);
          });
        });
    }

    public deleteAllSymptoms() {
        return new Promise((resolve, reject) => {
          this.storage.executeSql("DELETE FROM symptom_log", []).then((data) => {
              resolve(data);
          }, (error) => {
              reject(error);
          });
        });
    }

    public getSymptoms(sortby, sortdir) {

        return new Promise((resolve, reject) => {

            let symptom_log = [];

            if (sortby == "symptom") {
                this.storage.executeSql("SELECT * FROM symptom_log WHERE symptom1=1 ORDER BY timestamp DESC", [])
                .then((data) => {
                    for(var i = 0; i < data.rows.length; i++) {
                          symptom_log.push({timestamp: data.rows.item(i).timestamp, symptom1: data.rows.item(i).symptom1, symptom2: data.rows.item(i).symptom2, symptom3: data.rows.item(i).symptom3, notes: data.rows.item(i).notes});
                    }
                    return this.storage.executeSql("SELECT * FROM symptom_log WHERE symptom2=1 ORDER BY timestamp DESC", []);
                })
                .then((data) => {
                    for(var i = 0; i < data.rows.length; i++) {
                          symptom_log.push({timestamp: data.rows.item(i).timestamp, symptom1: data.rows.item(i).symptom1, symptom2: data.rows.item(i).symptom2, symptom3: data.rows.item(i).symptom3, notes: data.rows.item(i).notes});
                    }
                    resolve(symptom_log);
                }, (error) => {
                    console.log("ERROR: " + JSON.stringify(error));
                });
            }
            else {
              this.storage.executeSql("SELECT * FROM symptom_log ORDER BY " + sortby + " " + sortdir, []).then((data) => {
                  if(data.rows.length > 0) {
                      for(let i = 0; i < data.rows.length; i++) {
                          symptom_log.push({timestamp: data.rows.item(i).timestamp,
                          symptom1: data.rows.item(i).symptom1,
                          symptom2: data.rows.item(i).symptom2,
                          symptom3: data.rows.item(i).symptom3,
                          notes: data.rows.item(i).notes});
                      }
                  }
                  resolve(symptom_log);
              }, (error) => {
                  reject(error);
              });
            }
        });
    }

    public clearHistory() {
        return new Promise((resolve, reject) => {
          this.storage.executeSql("DELETE FROM patient_history", []).then((data) => {
              resolve(data);
          }, (error) => {
              reject(error);
          });
        });
    }

    public getProblems()
    {
        return new Promise((resolve, reject) => {
            this.storage.executeSql("SELECT * FROM patient_history", []).then((data) => {
                var problems = {};

                if (data.rows.length > 0) {
                    var problemJSON = data.rows.item(0).problems;
                    console.log("loaded problems JSON: " + problemJSON);
                    if (problemJSON && problemJSON.length > 0)
                    {
                      problems = JSON.parse(problemJSON);
                      resolve(problems);
                    }
                    else {
                      resolve(null);
                    }
                }
                else
                {
                   // no data, add a new row
                   var date = new Date();
                   var formattedDate = date.toUTCString().split(' ').slice(0, 5).join(' ');
                   this.storage.executeSql("INSERT INTO patient_history (timestamp, problems) VALUES (?, ?)", [formattedDate, ""]).then((data) => {
                      resolve(null);
                   }, (error) => {
                      reject(error);
                   });
                }

              }, (error) => {
                  reject(error);
              });
            });
     }

    public updateProblems(problemsJSON)
    {
        // console.log("updateProblems " + problemsJSON);
        return new Promise((resolve, reject) => {
          this.storage.executeSql("UPDATE patient_history SET problems = :problems", [problemsJSON]).then((data) => {
              resolve(data);
          }, (error) => {
              reject(error);
          });
        });
    }
}
