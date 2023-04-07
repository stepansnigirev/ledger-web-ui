{ pkgs ? import <nixpkgs> {} }:
  pkgs.mkShell {
    nativeBuildInputs = [
      pkgs.nodejs-19_x
    ];
    hardeningDisable = ["all"];
}
