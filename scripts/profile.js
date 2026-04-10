const { calculatePrice, applyMembershipDiscount } = require('../utils/logic');

function profileFunction(name, fn, ...args) {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = process.hrtime.bigint();

    fn(...args);

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;

    const timeTaken = Number(endTime - startTime) / 1e6; // แปลงเป็น ms
    const memoryUsed = (endMemory - startMemory) / 1024; // แปลงเป็น KB

    console.log(`--- Result for: ${name} ---`);
    console.log(`Execution Time: ${timeTaken.toFixed(4)} ms`);
    console.log(`Memory Usage: ${memoryUsed.toFixed(2)} KB`);
    console.log(`----------------------------\n`);
    
    return { name, timeTaken, memoryUsed };
}

console.log("Starting Dynamic Profiling...\n");

const report = [];
report.push(profileFunction("Calculate Rent (30 days)", calculatePrice, 500, 30));
report.push(profileFunction("Apply Gold Discount", applyMembershipDiscount, 15000, "Gold"));

console.log("Profiling Complete.");