import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlertRating } from '../entities/alert-rating.entity';
import { CreateAlertRatingDto } from '../dto/alert-rating.dto';
import { SosAlert } from '../entities/sos-alert.entity';
import { TrustedContact } from '../../users/entities/trusted-contact.entity';

@Injectable()
export class AlertRatingService {
  constructor(
    @InjectRepository(AlertRating)
    private ratingRepository: Repository<AlertRating>,
    @InjectRepository(TrustedContact)
    private trustedContactRepository: Repository<TrustedContact>,
  ) {}

  async createRating(
    alert: SosAlert,
    ratingDto: CreateAlertRatingDto,
  ): Promise<AlertRating> {
    const rating = this.ratingRepository.create({
      alert,
      rating: ratingDto.rating,
      comment: ratingDto.comment,
    });

    const trustedContact = await this.trustedContactRepository.findOne({
      where: { id: ratingDto.contactId },
    });

    if (trustedContact) {
      rating.trustedContact = trustedContact;
    }

    return this.ratingRepository.save(rating);
  }

  async createMultipleRatings(
    alert: SosAlert,
    ratingsDto: CreateAlertRatingDto[],
  ): Promise<AlertRating[]> {
    const ratings = await Promise.all(
      ratingsDto.map((ratingDto) => this.createRating(alert, ratingDto)),
    );
    return ratings;
  }
}
