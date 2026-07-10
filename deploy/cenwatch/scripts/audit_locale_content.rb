# frozen_string_literal: true

require "json"

def base_values(record, fields)
  fields.to_h { |field| [field, record.read_attribute(field)] }
end

def translation_values(record, fields)
  record.translations.order(:locale).map do |translation|
    {
      locale: translation.locale,
      values: fields.to_h { |field| [field, translation.public_send(field)] }
    }
  end
end

def audit_records(scope, fields)
  scope.includes(:translations).order(:id).map do |record|
    {
      id: record.id,
      base: base_values(record, fields),
      translations: translation_values(record, fields)
    }
  end
end

store = Spree::Store.default
abort "No default Spree store found" unless store

puts JSON.pretty_generate(
  store: {
    id: store.id,
    default_locale: store.default_locale,
    preferred_admin_locale: store.preferred_admin_locale,
    supported_locales: store.supported_locales_list,
    markets: store.markets.order(:id).map do |market|
      {
        id: market.id,
        default_locale: market.default_locale,
        supported_locales: market.supported_locales_list
      }
    end
  },
  products: audit_records(Spree::Product.all, %w[name slug]),
  taxons: audit_records(Spree::Taxon.all, %w[name permalink])
)
