import { Global, Module } from '@nestjs/common'

import { NodemailerMailProvider } from './nodemailer-mail-provider'
import { ResendMailProvider } from './resend-mail-provider'
import { TransactionalMailService } from './transactional-mail.service'

import { MailProvider } from '@/domain/application/providers/mail-provider'
import { TransactionalMailProvider } from '@/domain/application/providers/transactional-mail-provider'
import { EnvModule } from '@/infra/env/env.module'
import { EnvService } from '@/infra/env/env.service'

@Global()
@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: MailProvider,
      useFactory: (env: EnvService): MailProvider => {
        if (env.get('RESEND_ENABLED')) return new ResendMailProvider(env)
        if (env.get('MAIL_ENABLED')) return new NodemailerMailProvider(env)
        return new ResendMailProvider(env)
      },
      inject: [EnvService],
    },
    { provide: TransactionalMailProvider, useClass: TransactionalMailService },
  ],
  exports: [MailProvider, TransactionalMailProvider],
})
export class MailModule {}
