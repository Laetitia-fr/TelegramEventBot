/* eslint-disable @typescript-eslint/no-explicit-any */

export function all<Result>(pool: any, query: string, params?: Param[]): Promise<Result[]> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    pool.getConnection((err: any, connection: any) => {
      if (err) reject('Error: ' + err.message);
      connection.query(query, params, function (err: any, result: any) {
        if (err) reject('Error: ' + err.message);
        resolve(<Result[]>result);
      });
      connection.release();
    });

  });
}

export function get<Result>(pool: any, query: string, params?: Param[]): Promise<Result> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }
    
    pool.getConnection((err: any, connection: any) => {
      if (err) reject('Error: ' + err.message);
      connection.execute(query, params, function (err: any, result: any) {
        if (err) reject('Error: ' + err.message);
        resolve(<Result>result[0]);
      });
      connection.release();
    });
  });
}

export function run(pool: any, query: string, params?: Param[]): Promise<unknown[]> {
  return new Promise((resolve, reject) => {
    if (params == undefined) {
      params = [];
    }

    pool.getConnection((err: any, connection: any) => {
      if (err) reject('Error: ' + err.message);
      connection.execute(query, params, function (err: any, result: any) {
        if (err) reject('Error: ' + err.message);
        resolve(result);
      });
      connection.release();
    });
  });
}

export type Param = string | number | Date | null;