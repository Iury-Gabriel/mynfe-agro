import { DEFAULT_WORKER_OPTIONS, QUEUE_NAMES } from '@apps/queue'
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { Worker } from 'bullmq'

import type { SendEmailJobData } from './send-email.job'
import type { Job } from 'bullmq'

import { MailProvider } from '@/domain/application/providers/mail-provider'
import { RedisService } from '@/infra/cache/redis/redis.service'
import { DeadLetterService } from '@/infra/jobs/dead-letter.service'

@Injectable()
export class SendEmailProcessor implements OnModuleInit, OnModuleDestroy {
  private worker!: Worker

  constructor(
    private readonly mail: MailProvider,
    private readonly redis: RedisService,
    private readonly dlq: DeadLetterService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      QUEUE_NAMES.EMAILS,
      (job: Job<SendEmailJobData>) => this.process(job),
      { connection: this.redis, ...DEFAULT_WORKER_OPTIONS },
    )

    this.worker.on('failed', (job, err) => {
      if (job) void this.dlq.record(QUEUE_NAMES.EMAILS, job, err)
    })
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker.close()
  }

  async process(job: Job<SendEmailJobData>): Promise<{ sent: boolean }> {
    try {
      await this.mail.send({
        to: job.data.to,
        subject: job.data.subject,
        html: job.data.html,
      })
      return { sent: true }
    } catch (err) {
      console.error('[SendEmailProcessor]', err)
      throw err
    }
  }
}
