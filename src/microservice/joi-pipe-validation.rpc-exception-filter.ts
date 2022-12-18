import { Catch, RpcExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

import { JoiPipeValidationException } from '../internal/defs';

@Catch(JoiPipeValidationException)
export class JoiPipeValidationRpcExceptionFilter
  implements RpcExceptionFilter<JoiPipeValidationException>
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: JoiPipeValidationException /* , host: ArgumentsHost*/): Observable<any> {
    return throwError(() => new RpcException(exception.message));
  }
}
