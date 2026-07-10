# frozen_string_literal: true

require 'json'

candidates = Spree::Product.where(primary_media_id: nil)
summary = {
  inspected: 0,
  repaired: 0,
  skipped_without_media: 0,
  skipped_after_concurrent_update: 0
}

candidates.find_each do |product|
  summary[:inspected] += 1

  product.with_lock do
    product.reload

    if product.primary_media_id.present?
      summary[:skipped_after_concurrent_update] += 1
      next
    end

    unless product.media.exists? || product.variant_images.exists?
      summary[:skipped_without_media] += 1
      next
    end

    product.update_thumbnail!
    product.reload

    if product.primary_media_id.present?
      summary[:repaired] += 1
    else
      summary[:skipped_without_media] += 1
    end
  end
end

puts JSON.pretty_generate(summary)
