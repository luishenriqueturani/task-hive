export class SnowflakeId {
  private epoch: number = 1609459200000; // Custom epoch (e.g., January 1, 2021)
  private workerIdBits: number = 5;
  private datacenterIdBits: number = 5;
  private sequenceBits: number = 12;
  private maxWorkerId: number = (1 << this.workerIdBits) - 1;
  private maxDatacenterId: number = (1 << this.datacenterIdBits) - 1;
  private sequenceMask: number = (1 << this.sequenceBits) - 1;
  private workerIdShift: number = this.sequenceBits;
  private datacenterIdShift: number = this.sequenceBits + this.workerIdBits;
  private timestampLeftShift: number = this.sequenceBits + this.workerIdBits + this.datacenterIdBits;

  private workerId: number;
  private datacenterId: number;
  private sequence: number = 0;
  private lastTimestamp: number = -1;

  constructor(workerId: number, datacenterId: number) {
    if (workerId > this.maxWorkerId || workerId < 0) {
      throw new Error(`Worker ID must be between 0 and ${this.maxWorkerId}`);
    }
    if (datacenterId > this.maxDatacenterId || datacenterId < 0) {
      throw new Error(`Datacenter ID must be between 0 and ${this.maxDatacenterId}`);
    }
    this.workerId = workerId;
    this.datacenterId = datacenterId;
  }

  public nextId(): bigint {
    let timestamp = this.currentTimeMillis();

    if (timestamp < this.lastTimestamp) {
      throw new Error("Clock moved backwards. Refusing to generate id.");
    }

    if (timestamp === this.lastTimestamp) {
      this.sequence = (this.sequence + 1) & this.sequenceMask;
      if (this.sequence === 0) {
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      this.sequence = 0;
    }

    this.lastTimestamp = timestamp;

    // Cada parte do ID é deslocada para a esquerda para ocupar os bits corretos dentro do ID final
    return (
      (BigInt(timestamp - this.epoch) << BigInt(this.timestampLeftShift)) |
      (BigInt(this.datacenterId) << BigInt(this.datacenterIdShift)) |
      (BigInt(this.workerId) << BigInt(this.workerIdShift)) |
      BigInt(this.sequence)
    );
  }

  private waitNextMillis(lastTimestamp: number): number {
    let timestamp = this.currentTimeMillis();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimeMillis();
    }
    return timestamp;
  }

  private currentTimeMillis(): number {
    return Date.now();
  }

  /* Auxiliares */

  public extractTimestamp(id: bigint): number {
    return Number((id >> BigInt(this.timestampLeftShift)) + BigInt(this.epoch));
  }

  public extractDatacenterId(id: bigint): number {
    return Number((id >> BigInt(this.datacenterIdShift)) & BigInt(this.maxDatacenterId));
  }

  public extractWorkerId(id: bigint): number {
    return Number((id >> BigInt(this.workerIdShift)) & BigInt(this.maxWorkerId));
  }

  public extractSequence(id: bigint): number {
    return Number(id & BigInt(this.sequenceMask));
  }

  public extractAll(id: bigint): SnowflakeParams {
    return new SnowflakeParams(
      this.extractTimestamp(id),
      this.extractDatacenterId(id),
      this.extractWorkerId(id),
      this.extractSequence(id)
    );
  }
}

class SnowflakeParams {
  constructor(
    public timestamp: number,
    public datacenterId: number,
    public workerId: number,
    public sequence: number
  ) {}

  public toString(): string {
    return `SnowflakeParams{timestamp=${this.timestamp}, datacenterId=${this.datacenterId}, workerId=${this.workerId}, sequence=${this.sequence}}`;
  }
}