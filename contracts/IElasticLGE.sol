// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

interface IElasticLGE {
    function terms(address input) external returns(uint, uint);
}