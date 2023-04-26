/* eslint-disable @typescript-eslint/no-explicit-any */

export function all<Result>(connection: any, query: string, params?: Param[]): Promise<Result[]> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    connection.connect(function(err: any) {
      if (err) reject('Error: ' + err.message);
      connection.query(query, params, function (err: any, result: any) {
        if (err) reject('Error: ' + err.message);
        resolve(<Result[]>result);
      });
    });

  });
}

export function get<Result>(connection: any, query: string, params?: Param[]): Promise<Result> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    
    connection.connect(function(err: any) {
      if (err) reject('Error: ' + err.message);
      connection.execute(query, params, function (err: any, result: any) {
        if (err) reject('Error: ' + err.message);
        resolve(<Result>result[0]);
      });
    });
  });
}

export function run(connection: any, query: string, params?: Param[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }

    connection.connect(function(err: any) {
      if (err) reject('Error: ' + err.message);
      connection.execute(query, params, function (err: any, result: any) {
        if (err) reject('Error: ' + err.message);
        resolve(result);
      });
    });
  });
}

export type Param = string | number | Date | null;