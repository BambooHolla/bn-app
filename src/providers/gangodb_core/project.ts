import { toPathPieces, set, remove2, copy } from "./util";

import build from "./lang/expression";
import Fields from "./lang/fields";

const addition = (doc, new_doc, new_fields) => {
  for (var [path_pieces, add] of new_fields) {
    add(doc, new_doc, path_pieces);
  }

  return new_doc;
};

const _build = value1 => {
  const { ast, paths, has_refs } = build(value1);

  if (!has_refs) {
    const value2 = ast.run();

    return (doc, obj: any, path_pieces: any) => set(obj, path_pieces, value2);
  }

  return (doc, obj: any, path_pieces: any) => {
    const fields = new Fields(doc);

    if (fields.ensure(paths)) {
      set(obj, path_pieces, ast.run(fields));
    }
  };
};

export default function project(_next, spec) {
  const toBool = path => !!spec[path];
  let _id_bool = true;

  if (spec.hasOwnProperty("_id")) {
    _id_bool = toBool("_id");

    delete spec._id;
  }

  const existing_fields: any[] = [];
  const new_fields: any[] = [];
  let is_inclusion = true;

  const _mode = path => {
    if (toBool(path) !== is_inclusion) {
      throw Error("cannot mix inclusions and exclusions");
    }
  };

  let mode = path => {
    is_inclusion = toBool(path);

    mode = _mode;
  };

  for (var path in spec) {
    const value = spec[path];
    const path_pieces = toPathPieces(path);

    if (typeof value === "boolean" || value === 1 || value === 0) {
      mode(path);
      existing_fields.push(path_pieces);
    } else {
      new_fields.push([path_pieces, _build(value)]);
    }
  }

  const steps: any[] = [];

  if (new_fields.length) {
    steps.push((doc, new_doc) => {
      return addition(doc, new_doc, new_fields);
    });
  }

  if (!existing_fields.length) {
    let project;

    if (_id_bool) {
      project = (doc, new_doc) => {
        if (doc.hasOwnProperty("_id")) {
          new_doc._id = doc._id;
        }
      };
    } else {
      project = (doc, new_doc) => {
        delete new_doc._id;
      };
    }

    steps.push((doc, new_doc) => {
      project(doc, new_doc);

      return new_doc;
    });
  } else {
    if (is_inclusion === _id_bool) {
      existing_fields.push(["_id"]);
    }

    const project = is_inclusion ? copy : remove2;

    steps.push(doc => project(doc, existing_fields));
  }

  const next = cb => {
    _next((error, doc) => {
      if (!doc) {
        return cb(error);
      }

      let new_doc = doc;

      for (var fn of steps) {
        new_doc = fn(doc, new_doc);
      }

      cb(null, new_doc);
    });
  };

  return next;
}
