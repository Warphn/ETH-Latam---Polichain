// lib/youtube.ts
const YT_API = "https://www.googleapis.com/youtube/v3";

<<<<<<< HEAD
contract TransferWithFee {
    address public owner;
    uint256 public feePercent; // Exemplo: 2 = 2%

    struct User {
        uint256 balance;   // saldo total depositado pelo usuário
        uint256 spent;     // total gasto em transferências
    }

    mapping(address => User) public users; // controle individual de cada usuário

    event Deposit(address indexed from, uint256 amount, uint256 newBalance);
    event TransferExecuted(
        address indexed fromUser,
        address indexed to,
        uint256 amountSent,
        uint256 feeTaken
    );
    event FeeWithdrawn(address indexed owner, uint256 amount);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
=======
export function parseChannelInput(input: string): { id?: string; handle?: string } {
  const s = input.trim();

  // 1) ID direto (UCxxxx)
  if (/^UC[0-9A-Za-z_-]{22}$/.test(s)) return { id: s };
>>>>>>> 4261799 (Qualquer coisa final)

  // 2) Handle @algo
  if (s.startsWith("@")) return { handle: s.substring(1) };

  // 3) URL
  try {
    const u = new URL(s);
    // https://www.youtube.com/@Handle
    if (u.pathname.startsWith("/@")) return { handle: u.pathname.slice(2) };
    // https://www.youtube.com/channel/UC...
    if (u.pathname.startsWith("/channel/")) {
      const id = u.pathname.split("/")[2];
      if (id && /^UC[0-9A-Za-z_-]{22}$/.test(id)) return { id };
    }
  } catch {}

<<<<<<< HEAD
    // Qualquer pessoa pode depositar ETH no contrato
    function deposit() external payable {
        require(msg.value > 0, "Send ETH to deposit");
        users[msg.sender].balance += msg.value;

        emit Deposit(msg.sender, msg.value, users[msg.sender].balance);
    }

    // O dono executa uma transferência usando o saldo de um usuário
    function sendFromUser(
        address fromUser,
        address payable to,
        uint256 amount
    ) external {
        require(msg.sender == owner, "Only owner can execute transfer");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be > 0");

        User storage user = users[fromUser];
        require(user.balance >= amount, "Insufficient user balance");

        uint256 fee = (amount * feePercent) / 100;
        uint256 amountAfterFee = amount - fee;

        // Atualiza saldos do usuário
        user.balance -= amount;
        user.spent += amount;

        // Envia o valor ao destinatário (menos taxa)
        (bool sent, ) = to.call{value: amountAfterFee}("");
        require(sent, "Failed to send ETH");

        emit TransferExecuted(fromUser, to, amountAfterFee, fee);
    }

    // Dono pode sacar as taxas acumuladas (saldo remanescente não pertencente a usuários)
    function withdrawFees() external {
        require(msg.sender == owner, "Only owner can withdraw");

        uint256 totalUserBalance = 0;

        // Calcula o total pertencente aos usuários
        for (uint256 i = 0; i < _userList.length; i++) {
            totalUserBalance += users[_userList[i]].balance;
        }

        uint256 contractBal = address(this).balance;
        require(contractBal > totalUserBalance, "No fees available");

        uint256 fees = contractBal - totalUserBalance;

        (bool sent, ) = payable(owner).call{value: fees}("");
        require(sent, "Withdraw failed");

        emit FeeWithdrawn(owner, fees);
    }

    // Atualizar taxa
    function updateFee(uint256 _newFeePercent) external {
        require(msg.sender == owner, "Only owner");
        require(_newFeePercent <= 100, "Fee too high");
        emit FeeUpdated(feePercent, _newFeePercent);
        feePercent = _newFeePercent;
    }

    // Ver saldo total do contrato
    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // Ver saldo de um usuário
    function userBalance(address userAddr) external view returns (uint256) {
        return users[userAddr].balance;
    }


    address[] private _userList;

    // Atualiza lista de usuários ao primeiro depósito
    function _addUser(address userAddr) internal {
        bool exists = false;
        for (uint256 i = 0; i < _userList.length; i++) {
            if (_userList[i] == userAddr) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            _userList.push(userAddr);
        }
    }

    // Sobrescreve deposit() para incluir no registro
    receive() external payable {
        users[msg.sender].balance += msg.value;
        _addUser(msg.sender);
        emit Deposit(msg.sender, msg.value, users[msg.sender].balance);
    }
=======
  // fallback: trate como handle sem @
  return { handle: s.replace(/^@/, "") };
>>>>>>> 4261799 (Qualquer coisa final)
}

export async function resolveChannelId({
  input,
  apiKey,
}: {
  input: string;
  apiKey: string;
}): Promise<{ channelId: string; title?: string; description?: string } | null> {
  const { id, handle } = parseChannelInput(input);

  const qs = id
    ? new URLSearchParams({
        part: "id,snippet,brandingSettings",
        id,
        key: apiKey,
      })
    : new URLSearchParams({
        part: "id,snippet,brandingSettings",
        forHandle: handle!, // aceita com ou sem '@'
        key: apiKey,
      });

  const url = `${YT_API}/channels?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data: any = await res.json();
  const item = data.items?.[0];
  if (!item?.id) return null;

  return {
    channelId: item.id,
    title: item.snippet?.title,
    description: item.brandingSettings?.channel?.description ?? "",
  };
}

export async function fetchChannelBranding({
  channelId,
  apiKey,
}: {
  channelId: string;
  apiKey: string;
}): Promise<{ title?: string; description?: string } | null> {
  const qs = new URLSearchParams({
    part: "snippet,brandingSettings",
    id: channelId,
    key: apiKey,
  });
  const url = `${YT_API}/channels?${qs.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const data: any = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  return {
    title: item.snippet?.title,
    description: item.brandingSettings?.channel?.description ?? "",
  };
}