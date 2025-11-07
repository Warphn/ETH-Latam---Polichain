// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TransferWithFee {
    address public owner;
    uint256 public feePercent; // Exemplo: 2 significa 2%

    event TransferExecuted(
        address indexed from,
        address indexed to,
        uint256 amountSent,
        uint256 feeTaken
    );

    constructor(uint256 _feePercent) {
        require(_feePercent <= 100, "Fee must be between 0 and 100%");
        owner = msg.sender;
        feePercent = _feePercent;
    }

    // Função principal de transação com taxa
    function transferWithFee(address payable to) external payable {
        require(msg.value > 0, "Send ETH to transfer");
        require(to != address(0), "Invalid recipient");

        uint256 fee = (msg.value * feePercent) / 100;
        uint256 amountAfterFee = msg.value - fee;

        // Envia o valor (menos a taxa) ao destinatário
        (bool sent, ) = to.call{value: amountAfterFee}("");
        require(sent, "Failed to send ETH");

        // O restante (taxa) fica no contrato
        emit TransferExecuted(msg.sender, to, amountAfterFee, fee);
    }

    // Dono pode sacar o total acumulado no contrato
    function withdrawFees() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool sent, ) = payable(owner).call{value: balance}("");
        require(sent, "Withdraw failed");
    }

    // Permite atualizar a taxa (apenas o dono)
    function updateFee(uint256 _newFeePercent) external {
        require(msg.sender == owner, "Only owner");
        require(_newFeePercent <= 100, "Fee too high");
        feePercent = _newFeePercent;
    }

    // Ver o saldo de taxas acumuladas
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
