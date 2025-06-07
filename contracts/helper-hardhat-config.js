const networkConfig = {
    default: {
        name: "hardhat",
        fee: "100000000000000000",
        keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        jobId: "29fa9aa13bf1468788b7cc4a500a45b8",
        fundAmount: "1000000000000000000",
        automationUpdateInterval: "30",
        ccipRouter: "0x0000000000000000000000000000000000000000",
        linkToken: "0x0000000000000000000000000000000000000000",
    },
    31337: {
        name: "localhost",
        fee: "100000000000000000",
        keyHash: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        jobId: "29fa9aa13bf1468788b7cc4a500a45b8",
        fundAmount: "1000000000000000000",
        automationUpdateInterval: "30",
        ethUsdPriceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    },
    1: {
        name: "mainnet",
        linkToken: "0x514910771af9ca656af840dff83e8264ecf986ca",
        fundAmount: "0",
        automationUpdateInterval: "30",
    },
    11155111: {
        name: "sepolia",
        linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
        ethUsdPriceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
        keyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
        vrfCoordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
        vrfWrapper: "0x195f15F2d49d693cE265b4fB0fdDbE15b1850Cc1",
        oracle: "0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD",
        jobId: "ca98366cc7314957b8c012c72f05aeeb",
        // subscriptionId: "<add your subId of VRF>", 
        fee: "100000000000000000",
        fundAmount: "10000000000000000000", // 10
        automationUpdateInterval: "30",
    },
    137: {
        name: "polygon",
        linkToken: "0xb0897686c545045afc77cf20ec7a532e3120e0f1",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
        oracle: "0x0a31078cd57d23bf9e8e8f1ba78356ca2090569e",
        jobId: "12b86114fa9e46bab3ca436f88e1a912",
        fee: "100000000000000",
        fundAmount: "100000000000000",
    },
    80002: {
        name: "amoy",
        linkToken: "0x0fd9e8d3af1aaee056eb9e802c3a762a667b1904",
        ethUsdPriceFeed: "0xF0d50568e3A7e8259E16663972b11910F89BD8e7",
        keyHash: "0x816bedba8a50b294e5cbd47842baf240c2385f2eaf719edbd4f250a137a8c899",
        vrfCoordinator: "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2",
        vrfWrapper: "0x6e6c366a1cd1F92ba87Fd6f96F743B0e6c967Bf0",
        oracle: "0x40193c8518BB267228Fc409a613bDbD8eC5a97b3",
        jobId: "ca98366cc7314957b8c012c72f05aeeb",
        fee: "100000000000000000",
        fundAmount: "100000000000000000", // 0.1
        automationUpdateInterval: "30",
        ccipRouter: "0x70499c328e1e2a3c41108bd3730f6670a44595d1",
    },
    43114: {
        name: "avalanche",
        linkToken: "0x5947BB275c521040051D82396192181b413227A3",
        ethUsdPriceFeed: "0x976B3D034E162d8bD72D6b9C989d545b839003b0",
        ccipRouter: "0x52C84043CD9c865236f11d9Fc9F56aa003c1f922",
        fee: "100000000000000000",
        fundAmount: "100000000000000000", // 0.1
    },
    42161: {
        name: "arbitrum",
        linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
        ethUsdPriceFeed: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
        ccipRouter: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8",
        fee: "100000000000000000",
        fundAmount: "100000000000000000", // 0.1
    },
    8453: {
        name: "base",
        linkToken: "0x88Fb150BDc53A65fe94Dea0c9BA0a6dAf8C6e196",
        ccipRouter: "0x673AA85efd75080031d44F6A8F5e26b9C43571e4",
        fee: "100000000000000000",
        fundAmount: "100000000000000000", // 0.1
    },
    10: {
        name: "optimism",
        linkToken: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
        ethUsdPriceFeed: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
        ccipRouter: "0x261c05167db67B2B619f9d312e0753f3721ad6E8",
        fee: "100000000000000000",
        fundAmount: "100000000000000000", // 0.1
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}
