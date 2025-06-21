// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-github2';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
//   constructor(private configService: ConfigService) {
//     super({
//       clientID: configService.get('GITHUB_CLIENT_ID')!,
//       clientSecret: configService.get('GITHUB_CLIENT_SECRET')!,
//       callbackURL: configService.get('GITHUB_CALLBACK_URL')!,
//       scope: ['user:email'],
//     });
//   }

//   async validate(
//     accessToken: string,
//     refreshToken: string,
//     profile: any,
//   ): Promise<any> {
//     const { name, emails, photos } = profile;
//     const user = {
//       email: emails[0].value,
//       firstName: name?.givenName || profile.username,
//       lastName: name?.familyName || '',
//       picture: photos?.[0]?.value,
//       id: profile.id,
//     };
//     return user;
//   }
// }
