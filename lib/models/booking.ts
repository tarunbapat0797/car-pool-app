import mongoose, { Schema, Document, Model, Types } from 'mongoose'

export interface IBooking extends Document {
  rideId: Types.ObjectId
  riderId: Types.ObjectId
  pickupStop: string
  dropStop: string
  status: 'confirmed' | 'cancelled' | 'no_show'
  paymentStatus: 'pending' | 'paid'
  bookedAt: Date
}

const BookingSchema = new Schema<IBooking>(
  {
    rideId: { type: Schema.Types.ObjectId, ref: 'Ride', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    pickupStop: { type: String, required: true },
    dropStop: { type: String, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'no_show'], default: 'confirmed' },
    paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    bookedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// A rider can only have one active booking per ride
BookingSchema.index({ rideId: 1, riderId: 1 }, { unique: true })

const Booking: Model<IBooking> =
  mongoose.models.Booking ?? mongoose.model<IBooking>('Booking', BookingSchema)

export default Booking
