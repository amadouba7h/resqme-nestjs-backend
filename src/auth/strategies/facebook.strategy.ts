// import { Injectable } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { Strategy } from 'passport-facebook';
// import { ConfigService } from '@nestjs/config';

// @Injectable()
// export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
//   constructor(private configService: ConfigService) {
//     super({
//       clientID: configService.get('FACEBOOK_CLIENT_ID')!,
//       clientSecret: configService.get('FACEBOOK_CLIENT_SECRET')!,
//       callbackURL: configService.get('FACEBOOK_CALLBACK_URL')!,
//       scope: ['email', 'public_profile'],
//       profileFields: ['id', 'emails', 'name', 'picture'],
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
//       firstName: name.givenName,
//       lastName: name.familyName,
//       picture: photos?.[0]?.value,
//       id: profile.id,
//     };
//     return user;
//   }
// }
