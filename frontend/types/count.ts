/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/count.json`.
 */
export type Count = {
    "address": "HHJGbnqHDvbssE6eXqaJ8VKV9T58WLs96QGVCH89UyU",
    "metadata": {
      "name": "count",
      "version": "0.1.0",
      "spec": "0.1.0",
      "description": "Created with Anchor"
    },
    "instructions": [
      {
        "name": "increment",
        "discriminator": [
          11,
          18,
          104,
          9,
          104,
          174,
          59,
          33
        ],
        "accounts": [
          {
            "name": "globalCounter",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    99,
                    111,
                    117,
                    110,
                    116,
                    101,
                    114
                  ]
                }
              ]
            }
          }
        ],
        "args": []
      },
      {
        "name": "initialize",
        "discriminator": [
          175,
          175,
          109,
          31,
          13,
          152,
          155,
          237
        ],
        "accounts": [
          {
            "name": "globalCounter",
            "writable": true,
            "pda": {
              "seeds": [
                {
                  "kind": "const",
                  "value": [
                    99,
                    111,
                    117,
                    110,
                    116,
                    101,
                    114
                  ]
                }
              ]
            }
          },
          {
            "name": "user",
            "writable": true,
            "signer": true
          },
          {
            "name": "systemProgram",
            "address": "11111111111111111111111111111111"
          }
        ],
        "args": []
      }
    ],
    "accounts": [
      {
        "name": "globalCounter",
        "discriminator": [
          42,
          206,
          176,
          58,
          175,
          129,
          130,
          233
        ]
      }
    ],
    "types": [
      {
        "name": "globalCounter",
        "type": {
          "kind": "struct",
          "fields": [
            {
              "name": "count",
              "type": "u64"
            }
          ]
        }
      }
    ]
  };
  